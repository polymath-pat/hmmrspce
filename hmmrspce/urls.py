from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, template_views

router = DefaultRouter()
router.register(r'collections', views.CollectionViewSet, basename='collection')
router.register(r'items', views.ItemViewSet, basename='item')
router.register(r'users', views.UserViewSet)

urlpatterns = [
    # Template views
    path('', template_views.home, name='home'),
    path('collections/', template_views.collections, name='collections'),
    path('collections/<int:collection_id>/items/', template_views.collection_items, name='collection_items'),
    path('public/', template_views.public_collections, name='public_collections'),
    
    # API routes
    path('api/', include(router.urls)),
    path('api/auth/register/', views.register, name='register'),
    path('api/auth/login/', views.login, name='login'),
    path('api/auth/logout/', views.logout, name='logout'),
]