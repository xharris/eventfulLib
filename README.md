```
yarn add axios socket.io-client @tanstack/react-query react-use moment-timezone
```

in App.tsx

```jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "./eventfulLib/session";

const qc = new QueryClient();

const Inner = () => {
  useSession(true);
  return null;
};

function App() {
  <QueryClientProvider client={qc}>
    <SessionProvider>{/* ... */}</SessionProvider>
  </QueryClientProvider>;
}
```
