import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { CalendarLedger } from "./pages/CalendarLedger";
import { CampusRecommender } from "./pages/CampusRecommender";
import { Onboarding } from "./pages/Onboarding";
import { AdminPanel } from "./pages/AdminPanel";
import { Login } from "./pages/Login";
import { AiChat } from "./pages/AiChat";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "calendar", Component: CalendarLedger },
      { path: "campus", Component: CampusRecommender },
      { path: "chat", Component: AiChat },
      { path: "onboarding", Component: Onboarding },
      { path: "admin", Component: AdminPanel },
    ],
  },
]);
