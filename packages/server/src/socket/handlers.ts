import { Server, Socket } from 'socket.io';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join household room
    socket.on('join-household', (householdId: string) => {
      socket.join(`household:${householdId}`);
      console.log(`Socket ${socket.id} joined household ${householdId}`);
    });

    // Calendar updates
    socket.on('calendar:update', (data) => {
      const { householdId, ...update } = data;
      socket.to(`household:${householdId}`).emit('calendar:updated', update);
    });

    // Grocery list updates
    socket.on('grocery:item-checked', (data) => {
      const { householdId, ...update } = data;
      socket.to(`household:${householdId}`).emit('grocery:item-updated', update);
    });

    // Recipe updates
    socket.on('recipe:added', (data) => {
      const { householdId, ...recipe } = data;
      socket.to(`household:${householdId}`).emit('recipe:new', recipe);
    });

    // User presence
    socket.on('user:viewing', (data) => {
      const { householdId, resourceType, resourceId } = data;
      socket.to(`household:${householdId}`).emit('user:presence', {
        userId: socket.id,
        resourceType,
        resourceId,
        viewing: true,
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
