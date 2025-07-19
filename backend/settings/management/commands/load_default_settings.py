from django.core.management.base import BaseCommand
from settings.models import Setting
from settings.serializers import SETTINGS_SCHEMA

class Command(BaseCommand):
    help = 'Reload all default settings (does not overwrite existing values)'

    def handle(self, *args, **options):
        created = 0
        for key, meta in SETTINGS_SCHEMA.items():
            obj, was_created = Setting.objects.get_or_create(key=key, defaults={'value': meta['default']})
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'Loaded {created} default settings.')) 