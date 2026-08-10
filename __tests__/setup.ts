process.env.JWT_SECRET = "ci-test-secret-that-is-at-least-32-chars-long";
import '@testing-library/jest-dom';

// Only set up browser mocks in jsdom environment
if (typeof window !== 'undefined') {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock crypto.subtle for SHA-256
  const cryptoMock = {
    subtle: {
      digest: async (algorithm: string, data: BufferSource) => {
        const mockHash = new Uint8Array(32);
        const dataArr = new Uint8Array(data as ArrayBuffer);
        for (let i = 0; i < 32; i++) {
          mockHash[i] = dataArr[i % dataArr.length] || 0;
        }
        return mockHash.buffer;
      },
    },
  };

  Object.defineProperty(window, 'crypto', {
    value: cryptoMock,
  });

  // jsdom doesn't implement scrollIntoView; Radix UI (Select, etc.) calls it
  // on selection, which otherwise throws and can crash a passive effect.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  // jsdom doesn't implement PointerEvent capture APIs that Radix UI relies
  // on (Select/Tabs use pointer events for interaction).
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }

  // Mock fetch for jsdom tests
  const fetchMock = vi.fn();
  global.fetch = fetchMock;

  // Reset mocks before each test
  beforeEach(() => {
    localStorageMock.clear();
    fetchMock.mockReset();
  });
}
