import { privateRoutes, publicRoutes } from '..'
import { Route, Routes } from 'react-router-dom'

const HandleRoutes = () => {
    return (
        <div>
            <Routes>
                {publicRoutes.map((route, index) => {
                    return <Route key={index} path={route.path} element={<route.component />} />
                })}
                {privateRoutes.map((route, index) => {
                    return <Route key={index} path={route.path} element={<route.component />} />
                })}
            </Routes>
        </div>
    )
}

export default HandleRoutes