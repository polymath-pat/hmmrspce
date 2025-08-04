from django.shortcuts import render
from django.views.generic import TemplateView


class HomeView(TemplateView):
    template_name = 'index.html'


class CollectionsView(TemplateView):
    template_name = 'collections.html'


class PublicCollectionsView(TemplateView):
    template_name = 'public.html'


def home(request):
    return render(request, 'index.html')


def collections(request):
    return render(request, 'collections.html')


def public_collections(request):
    return render(request, 'public.html')


def collection_items(request, collection_id):
    return render(request, 'items.html')