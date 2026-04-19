import { DecisionEngine } from '../public/agents/DecisionEngine.js';
import { DataGenerator } from '../public/simulation/DataGenerator.js';

describe('Smart Routing AI System', () => {
  beforeAll(() => {
    DecisionEngine.init(); // build adjacency logic
  });

  it('should compute valid route between two zones', () => {
    const zones = DataGenerator.ZONES.map(z => ({
      ...z,
      density: 0.1 // basic density
    }));
    
    // Using demo data constants
    const route = DecisionEngine.computeRoute('gate-n', 'seating-se', zones);
    
    expect(route).toBeDefined();
    expect(route.path.length).toBeGreaterThan(0);
    expect(route.path[0]).toBe('gate-n');
    expect(route.path[route.path.length - 1]).toBe('seating-se');
    expect(route.estimatedTimeMin).toBeGreaterThan(0);
  });

  it('should apply AI penalty for high density zones', () => {
    const defaultZones = DataGenerator.ZONES.map(z => ({ ...z, density: 0.1 }));
    const baseRoute = DecisionEngine.computeRoute('gate-n', 'seating-se', defaultZones);

    const congestedZones = DataGenerator.ZONES.map(z => {
      // Create artificial bottleneck in the middle of standard path
      if (z.id === baseRoute.path[1]) {
        return { ...z, density: 0.95 }; // critical density
      }
      return { ...z, density: 0.1 };
    });

    const alternateRoute = DecisionEngine.computeRoute('gate-n', 'seating-se', congestedZones);
    
    expect(alternateRoute).toBeDefined();
    // Assuming the grid allows avoidance, the router heavily penalizes >0.8 density.
    expect(alternateRoute.path).not.toEqual(baseRoute.path);
    // The reason string should point out that it chose a route to avoid high density, or warn.
    expect(alternateRoute.reason).toBeDefined();
  });
});
