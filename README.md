# **Any Tournament - Image Tournament Creator**

## **Overview**

Any Tournament is an application designed to easily create and manage image-based tournaments. Whether you're looking for a fun way to compare pictures or organizing a competitive bracket, this tool provides multiple tournament formats to fit your needs.

## **Features**

- Select a folder of images to generate a tournament automatically
- ❌ Customizable tournament modes, including single and double elimination
- Multiplayer mode, allowing multiple players to vote online
- Dynamic tournament bracket that updates in real-time
- ❌ Local mode for single-player tournaments where one person selects the winners

## **Game Modes**

- Single Elimination → Classic 1v1 matches, the winner advances until only one remains
- ❌ Double Elimination → An image must lose twice before being eliminated
- ❌ 1vs1vs1vs1 → Four images compete simultaneously; the best advances
- ❌ 2vs2 Team Battles → Images are grouped into teams, and the winning team progresses

## **Getting Started**

1. Install the project
2. Install dependencies: `npm install`
3. Start the application: `npm start`

## **Usage**

1. Open the application in your web browser: `http://localhost:3000`
2. Create a new tournament by selecting a folder of images
3. Configure the tournament settings, such as the game mode and number of players
4. Start the tournament and let the players vote online
5. View the dynamic tournament bracket and results in real-time

## **Technical Details**

- Built using Node.js, Express, and WebSocket
- Uses a JSON database to store tournament data
- ❌ Supports multiple game modes and customizable tournament settings

## **Contributing**

Contributions are welcome! If you'd like to report a bug or suggest a new feature, please open an issue on the GitHub repository.

## **License**

This project is licensed under the MIT License. See the LICENSE file for details.
