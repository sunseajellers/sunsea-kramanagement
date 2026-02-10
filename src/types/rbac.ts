export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage'

export interface Permission {
    module: string
    action: Action
}

export interface Role {
    id: string
    name: string
    description?: string
    permissions: Permission[]
    isSystem?: boolean
    createdAt: Date
    updatedAt: Date
}

export interface UserPermissionSet {
    roleId: string
    roleName: string
    permissions: Permission[]
    customPermissions?: Permission[]
}
