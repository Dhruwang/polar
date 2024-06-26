"""subscription_tiers.index

Revision ID: 8b578f80b174
Revises: c3ef57daff7f
Create Date: 2024-04-24 13:08:14.228940

"""

import sqlalchemy as sa
from alembic import op

# Polar Custom Imports
from polar.kit.extensions.sqlalchemy import PostgresUUID

# revision identifiers, used by Alembic.
revision = "8b578f80b174"
down_revision = "c3ef57daff7f"
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index(
        "idx_organization_id_type",
        "subscription_tiers",
        ["organization_id", "type"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index("idx_organization_id_type", table_name="subscription_tiers")
    # ### end Alembic commands ###
