# Generated by Django 4.2.23 on 2025-07-15 17:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0003_remove_withdrawal_request_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='wallettransaction',
            name='transfer_by',
            field=models.CharField(blank=True, choices=[('Donor', 'Donor'), ('Admin', 'Admin'), ('System', 'System')], max_length=20, null=True),
        ),
    ]
