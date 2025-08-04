from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from hmmrspce.models import Collection, Item


class Command(BaseCommand):
    help = 'Create template collections for common collection types'

    def handle(self, *args, **options):
        # Create a template user if it doesn't exist
        template_user, created = User.objects.get_or_create(
            username='template_user',
            defaults={
                'email': 'templates@hammerspace.example',
                'first_name': 'Template',
                'last_name': 'User',
                'is_active': False  # Inactive so they can't login
            }
        )

        # Book Collection Template
        book_collection, created = Collection.objects.get_or_create(
            name='Book Collection Template',
            created_by=template_user,
            defaults={
                'description': 'Template for organizing your book collection',
                'visibility': 'public'
            }
        )

        if created:
            # Sample book item
            Item.objects.create(
                name='Example Book',
                description='This is an example of how to catalog your books',
                collection=book_collection,
                created_by=template_user,
                visibility='public',
                custom_fields={
                    'author': 'Author Name',
                    'isbn': '978-0000000000',
                    'pages': 300,
                    'genre': 'Fiction',
                    'publication_year': 2023,
                    'rating': 5,
                    'read_status': 'completed',
                    'purchase_date': '2024-01-01',
                    'format': 'hardcover',
                    'publisher': 'Publisher Name',
                    'language': 'English'
                }
            )

        # Comic Collection Template
        comic_collection, created = Collection.objects.get_or_create(
            name='Comic Collection Template',
            created_by=template_user,
            defaults={
                'description': 'Template for organizing your comic collection',
                'visibility': 'public'
            }
        )

        if created:
            # Sample comic item
            Item.objects.create(
                name='Example Comic #1',
                description='This is an example of how to catalog your comics',
                collection=comic_collection,
                created_by=template_user,
                visibility='public',
                custom_fields={
                    'series': 'Comic Series Name',
                    'issue_number': 1,
                    'publisher': 'Marvel',
                    'publication_date': '2024-01-01',
                    'writer': 'Writer Name',
                    'artist': 'Artist Name',
                    'cover_artist': 'Cover Artist Name',
                    'condition': 'Near Mint',
                    'variant': False,
                    'purchase_price': 4.99,
                    'current_value': 5.50,
                    'graded': False,
                    'bag_and_board': True
                }
            )

        # Keyboard Collection Template
        keyboard_collection, created = Collection.objects.get_or_create(
            name='Keyboard Collection Template',
            created_by=template_user,
            defaults={
                'description': 'Template for organizing your mechanical keyboard collection',
                'visibility': 'public'
            }
        )

        if created:
            # Sample keyboard item
            Item.objects.create(
                name='Example Mechanical Keyboard',
                description='This is an example of how to catalog your keyboards',
                collection=keyboard_collection,
                created_by=template_user,
                visibility='public',
                custom_fields={
                    'brand': 'Keychron',
                    'model': 'K8',
                    'layout': '75%',
                    'switches': 'Gateron Brown',
                    'keycaps': 'PBT Double Shot',
                    'connection': 'Wireless/USB-C',
                    'hot_swappable': True,
                    'rgb': True,
                    'purchase_date': '2024-01-01',
                    'purchase_price': 89.99,
                    'condition': 'Excellent',
                    'modifications': []
                }
            )

        self.stdout.write(
            self.style.SUCCESS('Successfully created collection templates')
        )