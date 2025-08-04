from rest_framework import permissions


class IsOwnerOrSharedAccess(permissions.BasePermission):
    """
    Custom permission to allow access to owners and shared users based on permission level.
    """
    
    def has_object_permission(self, request, view, obj):
        # Owner has full access
        if obj.created_by == request.user:
            return True
        
        # Check if user can access the object
        if not obj.can_user_access(request.user):
            return False
        
        # Get user's permission level
        permission_level = obj.get_user_permission(request.user)
        
        if request.method in permissions.SAFE_METHODS:
            # Read permissions for view, edit, manage, and owner
            return permission_level in ['view', 'edit', 'manage', 'owner']
        
        # Write permissions
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if hasattr(obj, 'collection'):  # This is an Item
                # For items, check collection permission
                collection_permission = obj.collection.get_user_permission(request.user)
                return collection_permission in ['edit', 'manage', 'owner']
            else:  # This is a Collection
                return permission_level in ['manage', 'owner']
        
        return False


class CanViewPublicContent(permissions.BasePermission):
    """
    Permission for public content viewing.
    """
    
    def has_permission(self, request, view):
        # Allow read-only access to public content for any user
        if request.method in permissions.SAFE_METHODS:
            return True
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Simple permission for owner-only write access.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by == request.user