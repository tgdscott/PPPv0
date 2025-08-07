import requests
from typing import Optional, Tuple, Union, List, Dict

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

    def create_show(self, title: str, description: Optional[str] = None) -> Tuple[bool, Union[Dict, str]]:
        """
        Creates a new show on Spreaker.

        Args:
            title: The title of the show.
            description: The description of the show.

        Returns:
            A tuple containing a boolean for success and either the new show dictionary or an error message.
        """
        endpoint = f"{self.BASE_URL}/shows"
        data = {
            "title": title,
        }
        if description:
            data["description"] = description

        try:
            response = requests.post(endpoint, headers=self.headers, data=data)
            response.raise_for_status()
            response_data = response.json()
            show = response_data.get("response", {}).get("show")
            if show:
                return True, show
            else:
                return False, f"Show creation failed. Spreaker response: {response.text}"
        except requests.exceptions.RequestException as e:
            return False, f"An API error occurred while creating show: {e}. Response: {e.response.text if e.response else 'No response'}"
        except Exception as e:
            return False, f"An unexpected error occurred while creating show: {e}"

    def upload_episode(
        self,
        show_id: str,
        title: str,
        file_path: str,
        description: Optional[str] = None,
        auto_published_at: Optional[str] = None, # ISO 8601 format for scheduled publishing
        publish_state: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Uploads an episode to Spreaker.

        Args:
            show_id: The ID of the show to upload the episode to.
            title: The title of the episode.
            file_path: The local path to the final audio file.
            description: The description or show notes for the episode.
            auto_published_at: Optional. ISO 8601 formatted datetime string for scheduled publishing.
            publish_state: Optional. The publishing state of the episode (e.g., 'published', 'unpublished').

        Returns:
            A tuple containing a boolean for success and a status message.
        """
        endpoint = f"{self.BASE_URL}/shows/{show_id}/episodes"

        data = {
            "title": title,
        }
        if description:
            data["description"] = description
        if auto_published_at:
            data["auto_published_at"] = auto_published_at
        if publish_state:
            data["publish_state"] = publish_state

        try:
            with open(file_path, "rb") as audio_file:
                files = {"media_file": audio_file}
                response = requests.post(endpoint, headers=self.headers, data=data, files=files)
                response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

            response_data = response.json()
            episode_id = response_data.get("response", {}).get("episode", {}).get("episode_id")
            
            if episode_id:
                return True, f"Successfully uploaded episode. Episode ID: {episode_id}"
            else:
                return False, f"Upload failed. Spreaker response: {response.text}"

        except requests.exceptions.RequestException as e:
            return False, f"An API error occurred: {e}. Response: {e.response.text if e.response else 'No response'}"
        except FileNotFoundError:
            return False, f"Audio file not found at path: {file_path}"
        except Exception as e:
            return False, f"An unexpected error occurred: {e}"

    def get_shows(self) -> Tuple[bool, Union[List[Dict], str]]:
        """
        Retrieves a list of shows for the authenticated user from Spreaker.

        Returns:
            A tuple containing a boolean for success and either a list of show dictionaries or an error message.
        """
        endpoint = f"{self.BASE_URL}/me/shows"
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            response_data = response.json()
            shows = response_data.get("response", {}).get("shows", [])
            return True, shows
        except requests.exceptions.RequestException as e:
            return False, f"An API error occurred while fetching shows: {e}. Response: {e.response.text if e.response else 'No response'}"
        except Exception as e:
            return False, f"An unexpected error occurred while fetching shows: {e}"