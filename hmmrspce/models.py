from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class CollectionShare(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Edit Items'),
        ('manage', 'Manage Collection'),
    ]
    
    collection = models.ForeignKey('Collection', on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_collections')
    permission_level = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collection_shares_created')

    class Meta:
        unique_together = ['collection', 'shared_with']

    def __str__(self):
        return f"{self.collection.name} shared with {self.shared_with.username} ({self.permission_level})"


class Collection(models.Model):
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
        ('unlisted', 'Unlisted (viewable with link)'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    is_public = models.BooleanField(default=False)  # Keep for backward compatibility
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'created_by']

    def __str__(self):
        return f"{self.name} by {self.created_by.username}"
    
    def save(self, *args, **kwargs):
        # Sync is_public with visibility for backward compatibility
        self.is_public = (self.visibility == 'public')
        super().save(*args, **kwargs)
    
    def can_user_access(self, user):
        """Check if user can access this collection"""
        if self.created_by == user:
            return True
        if self.visibility == 'public':
            return True
        if self.visibility == 'unlisted':
            return True
        return self.shares.filter(shared_with=user).exists()
    
    def get_user_permission(self, user):
        """Get user's permission level for this collection"""
        if self.created_by == user:
            return 'owner'
        if self.visibility == 'public':
            return 'view'
        share = self.shares.filter(shared_with=user).first()
        return share.permission_level if share else None


class Item(models.Model):
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
        ('collection', 'Same as Collection'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='items/', blank=True, null=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='collection')
    is_public = models.BooleanField(default=False)  # Keep for backward compatibility
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='items')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='items')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} in {self.collection.name}"
    
    def save(self, *args, **kwargs):
        # Sync is_public with visibility for backward compatibility
        if self.visibility == 'public':
            self.is_public = True
        elif self.visibility == 'collection':
            self.is_public = self.collection.is_public
        else:
            self.is_public = False
        super().save(*args, **kwargs)
    
    def can_user_access(self, user):
        """Check if user can access this item"""
        if self.created_by == user:
            return True
        if self.visibility == 'public':
            return True
        if self.visibility == 'collection':
            return self.collection.can_user_access(user)
        return False
    
    def get_user_permission(self, user):
        """Get user's permission level for this item"""
        if self.created_by == user:
            return 'owner'
        if self.visibility == 'public':
            return 'view'
        if self.visibility == 'collection':
            return self.collection.get_user_permission(user)
        return None

