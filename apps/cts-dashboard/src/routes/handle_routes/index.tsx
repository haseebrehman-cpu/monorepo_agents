import { privateRoutes } from '..'
import { Route, Routes } from 'react-router-dom'
import { RequirePermission } from '../guards'

const HandleRoutes = () => {
    return (
        <div>
            <Routes>
                {privateRoutes.map((route, index) => {
                    const Page = route.component
                    return (
                        <Route
                            key={index}
                            path={route.path}
                            element={
                                <RequirePermission code={route.permission}>
                                    <Page />
                                </RequirePermission>
                            }
                        />
                    )
                })}
            </Routes>
        </div>
    )
}

export default HandleRoutes
