from .parser_registry import NetworkParserRegistry


# parses the file
def parse_network_file(content: bytes, file_extension: str):
    return NetworkParserRegistry.parse_file(content, file_extension)

__all__ = ["parse_network_file", "NetworkParserRegistry"]