from django.db import migrations
from settings.serializers import SETTINGS_SCHEMA

def preload_settings(apps, schema_editor):
    Setting = apps.get_model('settings', 'Setting')
    for key, meta in SETTINGS_SCHEMA.items():
        Setting.objects.get_or_create(key=key, defaults={'value': meta['default']})

class Migration(migrations.Migration):
    dependencies = [
        ('settings', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(preload_settings),
    ] 