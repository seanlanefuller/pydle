# Pydle

Pydle is a stunning Wordle clone that provides both a desktop experience via Python's Tkinter and a web-based interface using modern HTML/CSS/JS.

## Features

- **Desktop Version**: A fully interactive Wordle game built with Python and Tkinter.
- **Web Version**: A sleek, responsive web application for playing in your browser.
- **Word Importer**: A utility script to generate a word list from system dictionaries.
- **Premium Design**: Dark mode aesthetics with vibrant color cues for a premium feel.

## Getting Started

### Desktop Version (Python)

To run the desktop version, ensure you have Python 3 installed.

1.  Navigate to the project root:
    ```bash
    cd pydle
    ```
2.  Run the game:
    ```bash
    python3 pydle.py
    ```

### Web Version

To run the web version, navigate to the `pydle_web` directory and open `index.html` in your favorite browser.

1.  Navigate to the web directory:
    ```bash
    cd pydle_web
    ```
2.  Open `index.html`:
    ```bash
    # On Linux:
    xdg-open index.html
    # On MacOS:
    open index.html
    ```

## Development

### Word Importer

If you need to refresh the `words.txt` file, you can run the `import_words.py` script. It extracts 5-letter words from the system's American English dictionary.

```bash
python3 import_words.py
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
