"""update test

Revision ID: e5df400dcde4
Revises: 52dac41a4a5b
Create Date: 2021-06-25 21:36:03.084373

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'e5df400dcde4'
down_revision = '52dac41a4a5b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('tests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=True),
    sa.Column('owner_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['owner_id'], ['authors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tests_id'), 'tests', ['id'], unique=False)
    op.create_index(op.f('ix_tests_title'), 'tests', ['title'], unique=False)
    op.drop_index('ix_test_id', table_name='test')
    op.drop_index('ix_test_title', table_name='test')
    op.drop_table('test')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('test',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('title', mysql.VARCHAR(length=200), nullable=True),
    sa.Column('owner_id', mysql.INTEGER(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['owner_id'], ['authors.id'], name='test_ibfk_1'),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset='utf8',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_test_title', 'test', ['title'], unique=False)
    op.create_index('ix_test_id', 'test', ['id'], unique=False)
    op.drop_index(op.f('ix_tests_title'), table_name='tests')
    op.drop_index(op.f('ix_tests_id'), table_name='tests')
    op.drop_table('tests')
    # ### end Alembic commands ###
