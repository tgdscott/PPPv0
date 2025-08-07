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

    def create_show(self, title: str, language: str, description: Optional[str] = None) -> Tuple[bool, Union[Dict, str]]:
        """
        Creates a new show on Spreaker.
        """
        endpoint = f"{self.BASE_URL}/shows"
        data = {
            "title": title,
            "language": language,
            "auto_publish": False,
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

    def update_show_image(self, show_id: str, image_file_path: str) -> Tuple[bool, str]:
        """
        Updates the cover art for a specific show on Spreaker.
        """
        endpoint = f"{self.BASE_URL}/shows/{show_id}"
        try:
            with open(image_file_path, "rb") as image_file:
                files = {"image_file": image_file}
                response = requests.post(endpoint, headers=self.headers, files=files)
                response.raise_for_status()
            return True, "Successfully updated show image."
        except requests.exceptions.RequestException as e:
            return False, f"An API error occurred while updating image: {e}. Response: {e.response.text if e.response else 'No response'}"
        except FileNotFoundError:
            return False, f"Image file not found at path: {image_file_path}"
        except Exception as e:
            return False, f"An unexpected error occurred while updating image: {e}"

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
