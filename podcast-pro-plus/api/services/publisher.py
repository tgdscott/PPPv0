import requests
from typing import Optional, Tuple

from ..core.config import settings

class SpreakerClient:
    """
    A client for interacting with the Spreaker API.
    """
    BASE_URL = "https://api.spreaker.com/v2"

    def __init__(self, api_token: str):
        self.api_token = api_token
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Accept": "application/json",
        }

    def upload_episode(
        self,
        show_id: str,
        title: str,
        file_path: str,
        description: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Uploads an episode to Spreaker as a draft.

        Args:
            show_id: The ID of the show to upload the episode to.
            title: The title of the episode.
            file_path: The local path to the final audio file.
            description: The description or show notes for the episode.

        Returns:
            A tuple containing a boolean for success and a status message.
        """
        endpoint = f"{self.BASE_URL}/shows/{show_id}/episodes"

        data = {
            "title": title,
            "auto_publish": "false",  # Upload as a draft
        }
        if description:
            data["description"] = description

        try:
            with open(file_path, "rb") as audio_file:
                files = {"media_file": audio_file}
                response = requests.post(endpoint, headers=self.headers, data=data, files=files)
                response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

            response_data = response.json()
            episode_id = response_data.get("response", {}).get("episode", {}).get("episode_id")
            
            if episode_id:
                return True, f"Successfully uploaded episode as a draft. Episode ID: {episode_id}"
            else:
                return False, f"Upload failed. Spreaker response: {response.text}"

        except requests.exceptions.RequestException as e:
            return False, f"An API error occurred: {e}. Response: {e.response.text if e.response else 'No response'}"
        except FileNotFoundError:
            return False, f"Audio file not found at path: {file_path}"
        except Exception as e:
            return False, f"An unexpected error occurred: {e}"

