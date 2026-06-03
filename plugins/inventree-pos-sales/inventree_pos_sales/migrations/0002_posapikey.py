# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventree_pos_sales", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PosApiKey",
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
                "verbose_name": "POS API Key",
                "verbose_name_plural": "POS API Keys",
                "ordering": ["name"],
            },
        ),
    ]
