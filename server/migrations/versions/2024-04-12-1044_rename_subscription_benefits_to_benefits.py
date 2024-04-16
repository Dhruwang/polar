"""Rename subscription_benefits to benefits

Revision ID: 1c75c9f84cf1
Revises: 9fae4998c18f
Create Date: 2024-04-12 10:44:25.753895

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# Polar Custom Imports
from polar.kit.extensions.sqlalchemy import PostgresUUID

# revision identifiers, used by Alembic.
revision = "1c75c9f84cf1"
down_revision = "9fae4998c18f"
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###

    op.drop_index("ix_subscription_benefits_type", table_name="subscription_benefits")
    op.rename_table("subscription_benefits", "benefits")
    op.create_index(op.f("ix_benefits_type"), "benefits", ["type"], unique=False)

    op.alter_column(
        "advertisement_campaigns",
        "subscription_benefit_id",
        new_column_name="benefit_id",
    )
    op.execute("""
        ALTER TABLE advertisement_campaigns
        RENAME CONSTRAINT "advertisement_campaigns_subscription_benefit_id_fkey"
        TO "advertisement_campaigns_benefit_id_fkey";
    """)

    op.alter_column(
        "subscription_benefit_grants",
        "subscription_benefit_id",
        new_column_name="benefit_id",
    )
    op.execute("""
        ALTER TABLE subscription_benefit_grants
        RENAME CONSTRAINT "subscription_benefit_grants_subscription_id_user_id_sub_cdda"
        TO "subscription_benefit_grants_sbu_key";
    """)
    op.execute("""
        ALTER INDEX ix_subscription_benefit_grants_subscription_benefit_id
        RENAME TO ix_subscription_benefit_grants_benefit_id;
    """)

    op.alter_column(
        "subscription_tier_benefits",
        "subscription_benefit_id",
        new_column_name="benefit_id",
    )
    op.execute("""
        ALTER TABLE subscription_tier_benefits
        RENAME CONSTRAINT "subscription_tier_benefits_subscription_benefit_id_fkey"
        TO "subscription_tier_benefits_benefit_id_fkey";
    """)
    # ### end Alembic commands ###


def downgrade() -> None:
    op.execute("""
        ALTER TABLE subscription_tier_benefits
        RENAME CONSTRAINT "subscription_tier_benefits_benefit_id_fkey"
        TO "subscription_tier_benefits_subscription_benefit_id_fkey";
    """)
    op.alter_column(
        "subscription_tier_benefits",
        "benefit_id",
        new_column_name="subscription_benefit_id",
    )

    op.execute("""
        ALTER INDEX ix_subscription_benefit_grants_benefit_id
        RENAME TO ix_subscription_benefit_grants_subscription_benefit_id;
    """)
    op.execute("""
        ALTER TABLE subscription_benefit_grants
        RENAME CONSTRAINT "subscription_benefit_grants_sbu_key"
        TO "subscription_benefit_grants_subscription_id_user_id_sub_cdda";
    """)
    op.alter_column(
        "subscription_benefit_grants",
        "benefit_id",
        new_column_name="subscription_benefit_id",
    )

    op.execute("""
        ALTER TABLE advertisement_campaigns
        RENAME CONSTRAINT "advertisement_campaigns_benefit_id_fkey"
        TO "advertisement_campaigns_subscription_benefit_id_fkey";
    """)
    op.alter_column(
        "advertisement_campaigns",
        "benefit_id",
        new_column_name="subscription_benefit_id",
    )

    op.drop_index("ix_benefits_type", table_name="benefits")
    op.rename_table("benefits", "subscription_benefits")
    op.create_index(
        op.f("ix_subscription_benefits_type"),
        "subscription_benefits",
        ["type"],
        unique=False,
    )