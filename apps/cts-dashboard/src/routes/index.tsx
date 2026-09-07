import { Login } from "../pages";
import Dashboard_Home from "../pages/dashboard/Dashboard_Home";

const publicRoutes = [
    { path: 'login', component: Login },
]

const privateRoutes = [
    {path: 'dashboard-home', component: Dashboard_Home}
]

export { publicRoutes, privateRoutes }