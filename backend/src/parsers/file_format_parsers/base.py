from abc import ABC, abstractmethod
from typing import Any, Dict


#abstract base class for all file format parsers aand defines the interface that all parsers must implement
class FileFormatParser(ABC):
    @abstractmethod
    def parse(self, content: bytes) -> Dict[str, Any]:
        pass