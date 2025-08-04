from django.contrib import admin
from .models import Collection, Item, CollectionShare


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'visibility', 'created_at']
    list_filter = ['visibility', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'collection', 'created_by', 'visibility', 'created_at']
    list_filter = ['visibility', 'created_at', 'collection']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CollectionShare)
class CollectionShareAdmin(admin.ModelAdmin):
    list_display = ['collection', 'shared_with', 'permission_level', 'created_by', 'created_at']
    list_filter = ['permission_level', 'created_at']
    search_fields = ['collection__name', 'shared_with__username']
    readonly_fields = ['created_at']
