# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("inventree_location_hours", "0002_locationapikey"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="webhookendpoint",
            name="secret_env_var",
        ),
    ]
