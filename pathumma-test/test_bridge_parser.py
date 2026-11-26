"""Offline parser contract tests. NO network calls / API Key required."""
import json
import unittest
from pathumma_bridge import parse_model_json, normalize_model_fields, BridgeOutputError


class ParserTests(unittest.TestCase):
    def test_dict_content(self):
        x=parse_model_json({"content": {"primaryEmotion": "joy", "interpretation": "ดีใจ"}})
        self.assertEqual(x["primaryEmotion"], "joy")

    def test_plain_json(self):
        x=parse_model_json({"content": '{"primaryEmotion":"sadness", "reflectionMessage":"รับรู้ความเศร้า"}'})
        self.assertEqual(x["primaryEmotion"], "sadness")

    def test_markdown_fence(self):
        content='```json\n{"primaryEmotion": "relief", "relationship": "aligned"}\n```'
        self.assertEqual(parse_model_json({"content": content})["primaryEmotion"],"relief")

    def test_prose_wrapped_json(self):
        content='ผลการวิเคราะห์:\n{"primaryEmotion":"joy"}\nเรียบร้อย'
        self.assertEqual(parse_model_json({"content":content})["primaryEmotion"], "joy")

    def test_list_wrapper(self):
        x=parse_model_json([{"text": '{"primaryEmotion":"hope"}'}])
        self.assertEqual(x["primaryEmotion"],"hope")

    def test_missing_primary_becomes_uncertain(self):
        x=normalize_model_fields({"interpretation":"ขอเวลาพัก"})
        self.assertEqual(x["primaryEmotion"],"uncertain")
        self.assertEqual(x["secondaryEmotion"],"none")
        self.assertEqual(x["relationship"],"uncertain")

    def test_thai_aliases(self):
        x=normalize_model_fields({"primaryEmotion":"ความสุข", "secondaryEmotion":"ความภูมิใจ"})
        self.assertEqual((x["primaryEmotion"],x["secondaryEmotion"]),("joy","pride"))

    def test_unparseable_output_fails_safely(self):
        with self.assertRaises(BridgeOutputError):
            parse_model_json({"content": '{"primaryEmotion":"joy"'})

    def test_empty_output_fails_safely(self):
        with self.assertRaises(BridgeOutputError):
            parse_model_json({"content": ""})

    def test_no_raw_response_in_error(self):
        secret="PRIVATE USER MESSAGE"
        with self.assertRaises(BridgeOutputError) as cm:
            parse_model_json({"content":secret})
        self.assertNotIn(secret,str(cm.exception))


if __name__ == "__main__":
    unittest.main(verbosity=2)
