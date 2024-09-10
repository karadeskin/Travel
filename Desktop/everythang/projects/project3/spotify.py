#import requests
import base64
import pandas as pd
import spotipy
from datetime import datetime
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

def get_access_token(CLIENT_ID, CLIENT_SECRET):
    #combine the client ID and secret and encode them in base64
    #spotify's API's require base64 formatting 
    client_credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
    client_credentials_base64 = base64.b64encode(client_credentials.encode()).decode()

    #prepare the request to get the access token
    token_url = 'https://accounts.spotify.com/api/token'
    headers = {'Authorization': f'Basic {client_credentials_base64}'}
    data = {'grant_type': 'client_credentials'}

    #send the request
    response = requests.post(token_url, headers=headers, data=data)

    #check if the request was successful
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print("Failed to get access token.")
        return None

def get_trending_playlist_data(playlist_id, access_token):
    #create a Spotify object with the access token
    sp = spotipy.Spotify(auth=access_token)

    #get the tracks in the playlist
    playlist_tracks = sp.playlist_tracks(playlist_id, fields='items(track(name, artists, album(name, id)))')
    music_data = []

    #loop through the tracks and collect data
    for item in playlist_tracks['items']:
        track = item['track']
        track_name = track['name']
        artists = ', '.join([artist['name'] for artist in track['artists']])
        album_name = track['album']['name']

        #get audio features for the track
        audio_features = sp.audio_features(track['id'])[0] if track['id'] else None

        #collect the data in a dictionary
        track_data = {
            'Track Name': track_name,
            'Artists': artists,
            'Album Name': album_name,
            'Danceability': audio_features['danceability'] if audio_features else None,
            'Energy': audio_features['energy'] if audio_features else None,
            'Tempo': audio_features['tempo'] if audio_features else None,
        }

        music_data.append(track_data)

    #vonvert the list of dictionaries to a DataFrame
    df = pd.DataFrame(music_data)
    return df, True

def content_based_recommendations(input_song_name, music_df, music_features_scaled, num_recommendations=5):
    #check if the song is in the dataset
    if input_song_name not in music_df['Track Name'].values:
        print(f"'{input_song_name}' not found. Please try another song.")
        return None

    #find the index of the input song
    input_index = music_df[music_df['Track Name'] == input_song_name].index[0]

    #compute similarity scores
    #cosine_similarity func calculates the cosine similarity between input song and all other songs 
    #cosine similarity is a metric that measures cosine of an angle between 2 songs 
    #if the songs are similar, the cos similarity will be closer to 1 
    similarity_scores = cosine_similarity([music_features_scaled[input_index]], music_features_scaled)

    #get indices of the most similar songs 
    #argsort() [::1] sorts the similarity scores from highest to lowest 
    similar_indices = similarity_scores[0].argsort()[::-1][1:num_recommendations + 1]

    #return the most similar songs
    return music_df.iloc[similar_indices][['Track Name', 'Artists', 'Album Name']]

def hybrid_recommendations(input_song_name, music_df, music_features_scaled, num_recommendations=5):
    #get content-based recommendations
    content_recs = content_based_recommendations(input_song_name, music_df, music_features_scaled, num_recommendations)

    #if none than return false 
    if content_recs is None:
        return None, False

    #sort recommendations by popularity (if available)
    #highest popularity will appear first 
    #sort_values is a pandas func 
    content_recs = content_recs.sort_values(by='Popularity', ascending=False)
    
    return content_recs, True
