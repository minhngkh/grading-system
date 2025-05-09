/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as AuthenticatedRouteImport } from './routes/_authenticated/route'
import { Route as AuthRouteImport } from './routes/_auth/route'
import { Route as IndexImport } from './routes/index'
import { Route as AuthenticatedHomeImport } from './routes/_authenticated/home'
import { Route as AuthSignupImport } from './routes/_auth/signup'
import { Route as AuthSigninImport } from './routes/_auth/signin'
import { Route as AuthenticatedFeaturesRubricGenerationImport } from './routes/_authenticated/_features/rubric-generation'
import { Route as AuthenticatedFeaturesManualGradeImport } from './routes/_authenticated/_features/manual-grade'
import { Route as AuthenticatedFeaturesManageRubricsImport } from './routes/_authenticated/_features/manage-rubrics'
import { Route as AuthenticatedFeaturesAssignmentGradingImport } from './routes/_authenticated/_features/assignment-grading'

// Create/Update Routes

const AuthenticatedRouteRoute = AuthenticatedRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRoute,
} as any)

const AuthRouteRoute = AuthRouteImport.update({
  id: '/_auth',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedHomeRoute = AuthenticatedHomeImport.update({
  id: '/home',
  path: '/home',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)

const AuthSignupRoute = AuthSignupImport.update({
  id: '/signup',
  path: '/signup',
  getParentRoute: () => AuthRouteRoute,
} as any)

const AuthSigninRoute = AuthSigninImport.update({
  id: '/signin',
  path: '/signin',
  getParentRoute: () => AuthRouteRoute,
} as any)

const AuthenticatedFeaturesRubricGenerationRoute =
  AuthenticatedFeaturesRubricGenerationImport.update({
    id: '/_features/rubric-generation',
    path: '/rubric-generation',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)

const AuthenticatedFeaturesManualGradeRoute =
  AuthenticatedFeaturesManualGradeImport.update({
    id: '/_features/manual-grade',
    path: '/manual-grade',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)

const AuthenticatedFeaturesManageRubricsRoute =
  AuthenticatedFeaturesManageRubricsImport.update({
    id: '/_features/manage-rubrics',
    path: '/manage-rubrics',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)

const AuthenticatedFeaturesAssignmentGradingRoute =
  AuthenticatedFeaturesAssignmentGradingImport.update({
    id: '/_features/assignment-grading',
    path: '/assignment-grading',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_auth': {
      id: '/_auth'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedRouteImport
      parentRoute: typeof rootRoute
    }
    '/_auth/signin': {
      id: '/_auth/signin'
      path: '/signin'
      fullPath: '/signin'
      preLoaderRoute: typeof AuthSigninImport
      parentRoute: typeof AuthRouteImport
    }
    '/_auth/signup': {
      id: '/_auth/signup'
      path: '/signup'
      fullPath: '/signup'
      preLoaderRoute: typeof AuthSignupImport
      parentRoute: typeof AuthRouteImport
    }
    '/_authenticated/home': {
      id: '/_authenticated/home'
      path: '/home'
      fullPath: '/home'
      preLoaderRoute: typeof AuthenticatedHomeImport
      parentRoute: typeof AuthenticatedRouteImport
    }
    '/_authenticated/_features/assignment-grading': {
      id: '/_authenticated/_features/assignment-grading'
      path: '/assignment-grading'
      fullPath: '/assignment-grading'
      preLoaderRoute: typeof AuthenticatedFeaturesAssignmentGradingImport
      parentRoute: typeof AuthenticatedRouteImport
    }
    '/_authenticated/_features/manage-rubrics': {
      id: '/_authenticated/_features/manage-rubrics'
      path: '/manage-rubrics'
      fullPath: '/manage-rubrics'
      preLoaderRoute: typeof AuthenticatedFeaturesManageRubricsImport
      parentRoute: typeof AuthenticatedRouteImport
    }
    '/_authenticated/_features/manual-grade': {
      id: '/_authenticated/_features/manual-grade'
      path: '/manual-grade'
      fullPath: '/manual-grade'
      preLoaderRoute: typeof AuthenticatedFeaturesManualGradeImport
      parentRoute: typeof AuthenticatedRouteImport
    }
    '/_authenticated/_features/rubric-generation': {
      id: '/_authenticated/_features/rubric-generation'
      path: '/rubric-generation'
      fullPath: '/rubric-generation'
      preLoaderRoute: typeof AuthenticatedFeaturesRubricGenerationImport
      parentRoute: typeof AuthenticatedRouteImport
    }
  }
}

// Create and export the route tree

interface AuthRouteRouteChildren {
  AuthSigninRoute: typeof AuthSigninRoute
  AuthSignupRoute: typeof AuthSignupRoute
}

const AuthRouteRouteChildren: AuthRouteRouteChildren = {
  AuthSigninRoute: AuthSigninRoute,
  AuthSignupRoute: AuthSignupRoute,
}

const AuthRouteRouteWithChildren = AuthRouteRoute._addFileChildren(
  AuthRouteRouteChildren,
)

interface AuthenticatedRouteRouteChildren {
  AuthenticatedHomeRoute: typeof AuthenticatedHomeRoute
  AuthenticatedFeaturesAssignmentGradingRoute: typeof AuthenticatedFeaturesAssignmentGradingRoute
  AuthenticatedFeaturesManageRubricsRoute: typeof AuthenticatedFeaturesManageRubricsRoute
  AuthenticatedFeaturesManualGradeRoute: typeof AuthenticatedFeaturesManualGradeRoute
  AuthenticatedFeaturesRubricGenerationRoute: typeof AuthenticatedFeaturesRubricGenerationRoute
}

const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedHomeRoute: AuthenticatedHomeRoute,
  AuthenticatedFeaturesAssignmentGradingRoute:
    AuthenticatedFeaturesAssignmentGradingRoute,
  AuthenticatedFeaturesManageRubricsRoute:
    AuthenticatedFeaturesManageRubricsRoute,
  AuthenticatedFeaturesManualGradeRoute: AuthenticatedFeaturesManualGradeRoute,
  AuthenticatedFeaturesRubricGenerationRoute:
    AuthenticatedFeaturesRubricGenerationRoute,
}

const AuthenticatedRouteRouteWithChildren =
  AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof AuthenticatedRouteRouteWithChildren
  '/signin': typeof AuthSigninRoute
  '/signup': typeof AuthSignupRoute
  '/home': typeof AuthenticatedHomeRoute
  '/assignment-grading': typeof AuthenticatedFeaturesAssignmentGradingRoute
  '/manage-rubrics': typeof AuthenticatedFeaturesManageRubricsRoute
  '/manual-grade': typeof AuthenticatedFeaturesManualGradeRoute
  '/rubric-generation': typeof AuthenticatedFeaturesRubricGenerationRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof AuthenticatedRouteRouteWithChildren
  '/signin': typeof AuthSigninRoute
  '/signup': typeof AuthSignupRoute
  '/home': typeof AuthenticatedHomeRoute
  '/assignment-grading': typeof AuthenticatedFeaturesAssignmentGradingRoute
  '/manage-rubrics': typeof AuthenticatedFeaturesManageRubricsRoute
  '/manual-grade': typeof AuthenticatedFeaturesManualGradeRoute
  '/rubric-generation': typeof AuthenticatedFeaturesRubricGenerationRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_auth': typeof AuthRouteRouteWithChildren
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/_auth/signin': typeof AuthSigninRoute
  '/_auth/signup': typeof AuthSignupRoute
  '/_authenticated/home': typeof AuthenticatedHomeRoute
  '/_authenticated/_features/assignment-grading': typeof AuthenticatedFeaturesAssignmentGradingRoute
  '/_authenticated/_features/manage-rubrics': typeof AuthenticatedFeaturesManageRubricsRoute
  '/_authenticated/_features/manual-grade': typeof AuthenticatedFeaturesManualGradeRoute
  '/_authenticated/_features/rubric-generation': typeof AuthenticatedFeaturesRubricGenerationRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | ''
    | '/signin'
    | '/signup'
    | '/home'
    | '/assignment-grading'
    | '/manage-rubrics'
    | '/manual-grade'
    | '/rubric-generation'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | ''
    | '/signin'
    | '/signup'
    | '/home'
    | '/assignment-grading'
    | '/manage-rubrics'
    | '/manual-grade'
    | '/rubric-generation'
  id:
    | '__root__'
    | '/'
    | '/_auth'
    | '/_authenticated'
    | '/_auth/signin'
    | '/_auth/signup'
    | '/_authenticated/home'
    | '/_authenticated/_features/assignment-grading'
    | '/_authenticated/_features/manage-rubrics'
    | '/_authenticated/_features/manual-grade'
    | '/_authenticated/_features/rubric-generation'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthRouteRoute: typeof AuthRouteRouteWithChildren
  AuthenticatedRouteRoute: typeof AuthenticatedRouteRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthRouteRoute: AuthRouteRouteWithChildren,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_auth",
        "/_authenticated"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_auth": {
      "filePath": "_auth/route.tsx",
      "children": [
        "/_auth/signin",
        "/_auth/signup"
      ]
    },
    "/_authenticated": {
      "filePath": "_authenticated/route.tsx",
      "children": [
        "/_authenticated/home",
        "/_authenticated/_features/assignment-grading",
        "/_authenticated/_features/manage-rubrics",
        "/_authenticated/_features/manual-grade",
        "/_authenticated/_features/rubric-generation"
      ]
    },
    "/_auth/signin": {
      "filePath": "_auth/signin.tsx",
      "parent": "/_auth"
    },
    "/_auth/signup": {
      "filePath": "_auth/signup.tsx",
      "parent": "/_auth"
    },
    "/_authenticated/home": {
      "filePath": "_authenticated/home.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_features/assignment-grading": {
      "filePath": "_authenticated/_features/assignment-grading.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_features/manage-rubrics": {
      "filePath": "_authenticated/_features/manage-rubrics.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_features/manual-grade": {
      "filePath": "_authenticated/_features/manual-grade.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_features/rubric-generation": {
      "filePath": "_authenticated/_features/rubric-generation.tsx",
      "parent": "/_authenticated"
    }
  }
}
ROUTE_MANIFEST_END */
