import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Recipe, CalendarEntry } from '@recipe-planner/shared';
import { API_URL } from '../config';
import { getAuthHeaders } from '../utils/auth';
import CalendarHeader from '../components/calendar/CalendarHeader';
import RecipeSidebar from '../components/calendar/RecipeSidebar';
import WeekView from '../components/calendar/WeekView';
import GroceryListModal from '../components/calendar/GroceryListModal';
import RecipeSelectionModal from '../components/calendar/RecipeSelectionModal';
import { getWeekStart, addDays, formatDateISO } from '../utils/dateHelpers';
import '../styles/calendar.css';

export default function CalendarPage() {
  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showRecipeSelectionModal, setShowRecipeSelectionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Calculate week date range
  const weekDateRange = useMemo(() => {
    const start = formatDateISO(currentWeekStart);
    const end = formatDateISO(addDays(currentWeekStart, 6));
    return { start, end };
  }, [currentWeekStart]);

  // Fetch recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Fetch calendar entries when week changes
  useEffect(() => {
    fetchCalendarEntries();
  }, [weekDateRange]);

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${API_URL}/recipes`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch recipes');

      const data = await response.json();
      setRecipes(data.recipes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes');
    }
  };

  const fetchCalendarEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/calendar?startDate=${weekDateRange.start}&endDate=${weekDateRange.end}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch calendar entries');

      const data = await response.json();
      setCalendarEntries(data.entries || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching calendar entries:', err);
      setError('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipeToDay = async (recipeId: string, date: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    // Optimistic update
    const optimisticEntry: CalendarEntry = {
      id: 'temp-' + Date.now(),
      householdId: 'temp',
      recipeId,
      customText: null,
      date,
      createdAt: new Date(),
      recipe,
    };

    setCalendarEntries((prev) => {
      // Remove any existing entry for this date (one per day)
      const filtered = prev.filter((e) => e.date.split('T')[0] !== date);
      return [...filtered, optimisticEntry];
    });

    try {
      // Server sync
      const response = await fetch(`${API_URL}/calendar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipeId, date }),
      });

      if (!response.ok) throw new Error('Failed to add recipe');

      const { entry } = await response.json();

      // Replace optimistic entry with real one
      setCalendarEntries((prev) =>
        prev.map((e) => (e.date.split('T')[0] === date ? entry : e))
      );
    } catch (err) {
      console.error('Error adding recipe:', err);
      // Rollback optimistic update
      setCalendarEntries((prev) =>
        prev.filter((e) => e.id !== optimisticEntry.id)
      );
      alert('Failed to add recipe to calendar');
    }
  };

  const handleAddCustomText = async (customText: string, date: string) => {
    // Optimistic update
    const optimisticEntry: CalendarEntry = {
      id: 'temp-' + Date.now(),
      householdId: 'temp',
      recipeId: null,
      customText,
      date,
      createdAt: new Date(),
    };

    setCalendarEntries((prev) => {
      // Remove any existing entry for this date (one per day)
      const filtered = prev.filter((e) => e.date.split('T')[0] !== date);
      return [...filtered, optimisticEntry];
    });

    try {
      // Server sync
      const response = await fetch(`${API_URL}/calendar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ customText, date }),
      });

      if (!response.ok) throw new Error('Failed to add custom text');

      const { entry } = await response.json();

      // Replace optimistic entry with real one
      setCalendarEntries((prev) =>
        prev.map((e) => (e.date.split('T')[0] === date ? entry : e))
      );
    } catch (err) {
      console.error('Error adding custom text:', err);
      // Rollback optimistic update
      setCalendarEntries((prev) =>
        prev.filter((e) => e.id !== optimisticEntry.id)
      );
      alert('Failed to add custom text to calendar');
    }
  };

  const handleRemoveRecipeFromDay = async (entryId: string) => {
    // Optimistic remove
    const removedEntry = calendarEntries.find((e) => e.id === entryId);
    setCalendarEntries((prev) => prev.filter((e) => e.id !== entryId));

    try {
      const response = await fetch(`${API_URL}/calendar/${entryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to remove recipe');
    } catch (err) {
      console.error('Error removing recipe:', err);
      // Rollback
      if (removedEntry) {
        setCalendarEntries((prev) => [...prev, removedEntry]);
      }
      alert('Failed to remove recipe from calendar');
    }
  };

  const handleClickToAddRecipe = (date: string) => {
    setSelectedDate(date);
    setShowRecipeSelectionModal(true);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleGenerateGroceryList = async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(`${API_URL}/grocery/generate-from-calendar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate grocery list');
      }

      alert('Grocery list generated successfully!');
      // Optionally redirect to grocery list page
      window.location.href = '/grocery-list';
    } catch (err: any) {
      console.error('Error generating grocery list:', err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const recipe = recipes.find((r) => r.id === event.active.id);
    setActiveRecipe(recipe || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRecipe(null);

    if (!over) return; // Dropped outside droppable area

    const recipeId = active.id as string;
    const date = over.id as string; // Format: 'YYYY-MM-DD'

    handleAddRecipeToDay(recipeId, date);
  };

  if (loading && calendarEntries.length === 0) {
    return (
      <div className="calendar-page">
        <div className="loading">Loading calendar...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="calendar-page">
        {error && <div className="error-message">{error}</div>}

        <CalendarHeader
          currentWeekStart={currentWeekStart}
          onNavigate={navigateWeek}
          onToday={goToToday}
          onGenerateGroceryList={() => setShowGroceryModal(true)}
        />

        <div className="calendar-content-wrapper">
          <RecipeSidebar
            recipes={recipes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <WeekView
            weekStart={currentWeekStart}
            entries={calendarEntries}
            onRemoveRecipe={handleRemoveRecipeFromDay}
            onClickToAddRecipe={handleClickToAddRecipe}
          />
        </div>

        <DragOverlay>
          {activeRecipe && (
            <div className="drag-overlay-card">
              {activeRecipe.imageUrl && (
                <img src={activeRecipe.imageUrl} alt={activeRecipe.title} />
              )}
              <span>{activeRecipe.title}</span>
            </div>
          )}
        </DragOverlay>

        {showGroceryModal && (
          <GroceryListModal
            onClose={() => setShowGroceryModal(false)}
            onGenerate={handleGenerateGroceryList}
            defaultStartDate={weekDateRange.start}
            defaultEndDate={weekDateRange.end}
          />
        )}

        {showRecipeSelectionModal && selectedDate && (
          <RecipeSelectionModal
            date={selectedDate}
            recipes={recipes}
            onSelectRecipe={handleAddRecipeToDay}
            onAddCustomText={handleAddCustomText}
            onClose={() => {
              setShowRecipeSelectionModal(false);
              setSelectedDate(null);
            }}
          />
        )}
      </div>
    </DndContext>
  );
}
