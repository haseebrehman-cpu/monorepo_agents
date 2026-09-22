import { privateRoutes } from '..'
import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequirePermission } from '../guards'

const HandleRoutes = () => {
    return (
        <div>
            <Suspense fallback={<p className="p-4 text-sm text-slate-500">Loading page...</p>}>
                <Routes>
                    {privateRoutes.map((route) => {
                        const Page = route.component
                        return (
                            <Route
                                key={route.path}
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
            </Suspense>
        </div>
    )
}

export default HandleRoutes
