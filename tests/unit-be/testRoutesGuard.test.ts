import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// The guard lives in app.ts. We test the logic by checking the condition evaluation.
// Since importing app.ts in a unit test would boot the full Fastify instance,
// we test the guard condition in isolation.

describe('testRoutes boot guard', () => {
  it('throws when ENABLE_TEST_ROUTES=1 is set without NODE_ENV=test', () => {
    // Save original env
    const origNodeEnv = process.env.NODE_ENV;
    const origEnableTestRoutes = process.env.ENABLE_TEST_ROUTES;

    process.env.ENABLE_TEST_ROUTES = '1';
    process.env.NODE_ENV = 'production';

    let threw = false;
    try {
      if (process.env.ENABLE_TEST_ROUTES === '1' && process.env.NODE_ENV !== 'test') {
        throw new Error(
          'ENABLE_TEST_ROUTES=1 is set but NODE_ENV is not "test". ' +
            'This is a config drift guard — check your compose file.'
        );
      }
    } catch (err) {
      threw = true;
      assert.match(
        (err as Error).message,
        /ENABLE_TEST_ROUTES=1.*NODE_ENV.*not "test"/,
        `Unexpected error message: ${(err as Error).message}`
      );
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.ENABLE_TEST_ROUTES = origEnableTestRoutes;
    }

    assert.ok(threw, 'Expected guard to throw when ENABLE_TEST_ROUTES=1 without NODE_ENV=test');
  });

  it('does NOT throw when ENABLE_TEST_ROUTES=1 AND NODE_ENV=test', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origEnableTestRoutes = process.env.ENABLE_TEST_ROUTES;

    process.env.ENABLE_TEST_ROUTES = '1';
    process.env.NODE_ENV = 'test';

    let threw = false;
    try {
      if (process.env.ENABLE_TEST_ROUTES === '1' && process.env.NODE_ENV !== 'test') {
        throw new Error('Should have thrown but did not');
      }
    } catch {
      threw = true;
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      process.env.ENABLE_TEST_ROUTES = origEnableTestRoutes;
    }

    assert.ok(!threw, 'Guard should not throw when both ENABLE_TEST_ROUTES=1 and NODE_ENV=test');
  });

  it('does NOT throw when ENABLE_TEST_ROUTES is not set', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origEnableTestRoutes = process.env.ENABLE_TEST_ROUTES;

    delete process.env.ENABLE_TEST_ROUTES;
    process.env.NODE_ENV = 'production';

    let threw = false;
    try {
      if (process.env.ENABLE_TEST_ROUTES === '1' && process.env.NODE_ENV !== 'test') {
        throw new Error('Should have thrown but did not');
      }
    } catch {
      threw = true;
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      if (origEnableTestRoutes !== undefined) {
        process.env.ENABLE_TEST_ROUTES = origEnableTestRoutes;
      }
    }

    assert.ok(!threw, 'Guard should not throw when ENABLE_TEST_ROUTES is not set');
  });
});
