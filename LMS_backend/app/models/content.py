from datetime import datetime

from sqlalchemy import Column, DateTime, String, ForeignKey, Boolean
from app.db.database import Base

class Content(Base):
    __tablename__ = "contents"

    content_id = Column(String, primary_key=True)
    sub_topic_id = Column(String, ForeignKey("sub_topics.sub_topic_id"))
    content_type = Column(String)
    title = Column(String)
    isHidden = Column(Boolean) # "true" or "false"
    created_at = Column(DateTime, default=datetime.utcnow)
