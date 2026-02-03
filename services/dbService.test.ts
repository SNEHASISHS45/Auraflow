import { describe, it, expect, vi } from 'vitest';
import { dbService } from './dbService';
import * as firestore from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', async () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({
      docs: []
    })),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    increment: vi.fn(),
    doc: vi.fn(),
    Timestamp: { now: vi.fn() },
    serverTimestamp: vi.fn(),
  };
});

// Mock ./firebase
vi.mock('./firebase', () => ({
  db: {}
}));

describe('dbService', () => {
  it('getUserWallpapers should use orderBy', async () => {
    await dbService.getUserWallpapers('user123');

    // Check if orderBy was passed to query
    const orderByCalls = vi.mocked(firestore.orderBy).mock.calls;

    // We expect it to be called with "createdAt", "desc"
    expect(orderByCalls.length).toBeGreaterThan(0);
    expect(orderByCalls.some(call => call[0] === 'createdAt' && call[1] === 'desc')).toBe(true);
  });
});
