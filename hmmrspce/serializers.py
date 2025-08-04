from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Collection, Item, CollectionShare


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class CollectionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    items_count = serializers.SerializerMethodField()
    user_permission = serializers.SerializerMethodField()
    shared_with_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'description', 'visibility', 'is_public', 'created_by', 
                 'created_at', 'updated_at', 'items_count', 'user_permission', 'shared_with_count']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'is_public']

    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_user_permission(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_permission(request.user)
        return None
    
    def get_shared_with_count(self, obj):
        return obj.shares.count()

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ItemSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    user_permission = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'image', 'custom_fields', 
                 'visibility', 'is_public', 'collection', 'collection_name', 'created_by', 
                 'created_at', 'updated_at', 'user_permission']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'is_public']
    
    def get_user_permission(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_permission(request.user)
        return None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class PublicCollectionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'description', 'created_by', 
                 'created_at', 'items_count']

    def get_items_count(self, obj):
        return obj.items.filter(is_public=True).count()


class PublicItemSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'image', 'custom_fields', 
                 'collection_name', 'created_by', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return data


class CollectionShareSerializer(serializers.ModelSerializer):
    shared_with = UserSerializer(read_only=True)
    shared_with_username = serializers.CharField(write_only=True)
    collection_name = serializers.CharField(source='collection.name', read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = CollectionShare
        fields = ['id', 'collection', 'collection_name', 'shared_with', 'shared_with_username', 
                 'permission_level', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

    def validate_shared_with_username(self, value):
        try:
            user = User.objects.get(username=value)
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

    def create(self, validated_data):
        shared_with_user = validated_data.pop('shared_with_username')
        validated_data['shared_with'] = shared_with_user
        validated_data['created_by'] = self.context['request'].user
        
        # Check if user is trying to share with themselves
        if shared_with_user == self.context['request'].user:
            raise serializers.ValidationError("Cannot share collection with yourself")
        
        return super().create(validated_data)