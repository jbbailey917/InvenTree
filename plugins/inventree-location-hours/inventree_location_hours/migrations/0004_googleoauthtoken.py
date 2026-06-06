# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventree_location_hours", "0003_remove_webhookendpoint_secret_env_var"),
    ]

    operations = [
        migrations.CreateModel(
            name="GoogleOAuthToken",
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
                    "access_token",
                    models.TextField(
                        blank=True,
                        help_text="Encrypted at rest.",
                        verbose_name="Access Token",
                    ),
                ),
                (
                    "refresh_token",
                    models.TextField(
                        blank=True,
                        help_text="Encrypted at rest.",
                        verbose_name="Refresh Token",
                    ),
                ),
                (
                    "google_email",
                    models.CharField(
                        blank=True,
                        help_text="Email of the connected Google account",
                        max_length=200,
                        verbose_name="Google Email",
                    ),
                ),
                (
                    "expires_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Expires At"
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
                "verbose_name": "Google OAuth Token",
                "verbose_name_plural": "Google OAuth Tokens",
            },
        ),
    ]
