from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Collection, Item, CollectionShare
from .serializers import (
    CollectionSerializer, ItemSerializer, UserSerializer,
    PublicCollectionSerializer, PublicItemSerializer,
    UserRegistrationSerializer, LoginSerializer, CollectionShareSerializer
)
from .permissions import IsOwnerOrSharedAccess, CanViewPublicContent


class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrSharedAccess]

    def get_queryset(self):
        user = self.request.user
        # Get collections owned by user or shared with user
        owned = Collection.objects.filter(created_by=user)
        shared = Collection.objects.filter(shares__shared_with=user)
        return (owned | shared).distinct()

    @action(detail=False, methods=['get'])
    def public(self, request):
        public_collections = Collection.objects.filter(visibility='public')
        serializer = PublicCollectionSerializer(public_collections, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unlisted(self, request):
        """Get unlisted collections - accessible with direct link"""
        unlisted_collections = Collection.objects.filter(visibility='unlisted')
        serializer = PublicCollectionSerializer(unlisted_collections, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def shares(self, request, pk=None):
        """Manage collection sharing"""
        collection = self.get_object()
        
        # Only owner can manage shares
        if collection.created_by != request.user:
            return Response({'error': 'Only collection owner can manage shares'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            shares = collection.shares.all()
            serializer = CollectionShareSerializer(shares, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = CollectionShareSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(collection=collection)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrSharedAccess]

    def get_queryset(self):
        user = self.request.user
        collection_id = self.request.query_params.get('collection', None)
        
        # Get items from collections user owns or has access to
        accessible_collections = Collection.objects.filter(
            Q(created_by=user) | Q(shares__shared_with=user)
        ).distinct()
        
        queryset = Item.objects.filter(collection__in=accessible_collections)
        
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def public(self, request):
        collection_id = request.query_params.get('collection', None)
        
        queryset = Item.objects.filter(visibility='public')
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        
        serializer = PublicItemSerializer(queryset, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out'})
    except:
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)
