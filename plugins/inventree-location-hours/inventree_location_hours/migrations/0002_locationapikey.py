# Generated manually

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventree_location_hours", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LocationApiKey",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="Human-readable name for this key",
                        max_length=200,
                        unique=True,
                        verbose_name="Name",
                    ),
                ),
                (
                    "description",
                    models.CharField(
                        blank=True,
                        max_length=500,
                        verbose_name="Description",
                    ),
                ),
                (
                    "api_key",
                    models.TextField(
                        blank=True,
                        help_text="Encrypted at rest.",
                        verbose_name="API Key",
                    ),
                ),
                (
                    "created",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created"),
                ),
                (
                    "updated",
                    models.DateTimeField(auto_now=True, verbose_name="Updated"),
                ),
            ],
            options={
                "verbose_name": "Location API Key",
                "verbose_name_plural": "Location API Keys",
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="webhookendpoint",
            name="api_key_ref",
            field=models.ForeignKey(
                blank=True,
                help_text="Stored API key (takes precedence over env var)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="webhook_endpoints",
                to="inventree_location_hours.locationapikey",
                verbose_name="API Key",
            ),
        ),
    ]
