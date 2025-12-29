import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ApiGroupList from './pages/ApiGroupList'
import ApiGroupDetail from './pages/ApiGroupDetail'
import TestCaseCreate from './pages/TestCaseCreate'
import TestCaseDetail from './pages/TestCaseDetail'
import TestCaseVisual from './pages/TestCaseVisual'
import TestExecutionDetail from './pages/TestExecutionDetail'
import TestCaseExecute from './pages/TestCaseExecute'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/api-groups" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/api-groups" /> : <Register />} />
      
      {/* 首页重定向到分组列表 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/api-groups" replace />
          </ProtectedRoute>
        }
      />
      
      {/* API分组列表（主入口） */}
      <Route
        path="/api-groups"
        element={
          <ProtectedRoute>
            <Layout>
              <ApiGroupList />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* API分组详情（集成所有功能） */}
      <Route
        path="/api-groups/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ApiGroupDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 分组内创建用例 */}
      <Route
        path="/api-groups/:groupId/test-cases/create"
        element={
          <ProtectedRoute>
            <Layout>
              <TestCaseCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 用例详情 */}
      <Route
        path="/test-cases/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TestCaseDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 用例可视化（增强版，可执行和编辑） */}
      <Route
        path="/test-cases/:id/visual"
        element={
          <ProtectedRoute>
            <Layout>
              <TestCaseVisual />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 执行用例 */}
      <Route
        path="/test-cases/:id/execute"
        element={
          <ProtectedRoute>
            <Layout>
              <TestCaseExecute />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 执行详情 */}
      <Route
        path="/test-executions/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TestExecutionDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 兼容旧路由重定向 */}
      <Route path="/api-docs" element={<Navigate to="/api-groups" replace />} />
      <Route path="/api-docs/*" element={<Navigate to="/api-groups" replace />} />
      <Route path="/test-cases" element={<Navigate to="/api-groups" replace />} />
      
      {/* 404 - 未匹配路由重定向 */}
      <Route path="*" element={<Navigate to="/api-groups" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
