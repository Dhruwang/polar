"""organization.custom_domain

Revision ID: 4409260f269e
Revises: 905355380301
Create Date: 2024-02-27 15:25:45.991094

"""

import sqlalchemy as sa
from alembic import op

# Polar Custom Imports
from polar.kit.extensions.sqlalchemy import PostgresUUID

# revision identifiers, used by Alembic.
revision = "4409260f269e"
down_revision = "905355380301"
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "organizations", sa.Column("custom_domain", sa.String(), nullable=True)
    )
    op.create_unique_constraint(
        op.f("organizations_custom_domain_key"), "organizations", ["custom_domain"]
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(
        op.f("organizations_custom_domain_key"), "organizations", type_="unique"
    )
    op.drop_column("organizations", "custom_domain")
    # ### end Alembic commands ###
