from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey
from app.db.database import Base

class SubTopic(Base):
    __tablename__ = "sub_topics"

    sub_topic_id = Column(String, primary_key=True)
    main_topic_id = Column(String, ForeignKey("main_topics.main_topic_id"))
    title = Column(String)  
    isHidden = Column(Boolean) # "true" or "false"
    created_at = Column(DateTime, default=datetime.utcnow)
