# migrate_store.py
from sqlalchemy import MetaData, text
from database import engine

def migrate_store_table():
    """Add missing columns to stores table if they don't exist."""
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    stores_table = metadata.tables.get('stores')
    if stores_table is None:
        print("Stores table doesn't exist yet, will be created on next run")
        return
    
    existing_columns = [c.name for c in stores_table.columns]
    
    new_columns = []
    if 'fb_page_id' not in existing_columns:
        new_columns.append("ALTER TABLE stores ADD COLUMN fb_page_id VARCHAR(100)")
    if 'fb_access_token' not in existing_columns:
        new_columns.append("ALTER TABLE stores ADD COLUMN fb_access_token TEXT")
    if 'gemini_api_key' not in existing_columns:
        new_columns.append("ALTER TABLE stores ADD COLUMN gemini_api_key TEXT")
    
    if new_columns:
        with engine.connect() as conn:
            for sql in new_columns:
                try:
                    conn.execute(text(sql))
                    print(f"✅ Executed: {sql}")
                except Exception as e:
                    print(f"⚠️ Error executing {sql}: {e}")
            conn.commit()
        print("✅ Database migration completed!")
    else:
        print("✅ No migration needed - all columns exist")

if __name__ == "__main__":
    migrate_store_table()
