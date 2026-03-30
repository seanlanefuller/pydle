import tkinter as tk
from tkinter import messagebox
import random

class PydleGame:
    def __init__(self, root):
        self.root = root
        self.root.title("Pydle")
        self.root.geometry("1000x900")
        self.root.configure(bg="#121213")  # Dark theme background

        self.words = self.load_words("words.txt")
        self.secret_word = random.choice(self.words).upper()
        
        # Game State
        self.current_row = 0
        self.current_col = 0
        self.guesses = [["" for _ in range(5)] for _ in range(6)]
        self.game_over = False

        # Colors
        self.COLOR_CORRECT = "#538d4e"  # Green
        self.COLOR_PRESENT = "#b59f3b"  # Yellow
        self.COLOR_ABSENT = "#3a3a3c"   # Gray
        self.COLOR_DEFAULT = "#121213"  # Dark Gray/Black
        self.COLOR_BORDER = "#3a3a3c"
        self.COLOR_FILLED_BORDER = "#565758"

        self.setup_ui()
        self.root.bind("<Key>", self.handle_keypress)

    def load_words(self, filename):
        try:
            with open(filename, "r") as f:
                return [word.strip().upper() for word in f.readlines() if len(word.strip()) == 5]
        except FileNotFoundError:
            messagebox.showerror("Error", "words.txt not found!")
            self.root.destroy()
            return []

    def setup_ui(self):
        # Title
        title_label = tk.Label(self.root, text="PYDLE", font=("Helvetica", 36, "bold"), 
                               bg="#121213", fg="white")
        title_label.pack(pady=20)

        # Game Grid
        self.grid_frame = tk.Frame(self.root, bg="#121213")
        self.grid_frame.pack(pady=20)

        self.cells = []
        for row in range(6):
            row_cells = []
            for col in range(5):
                cell = tk.Label(self.grid_frame, text="", font=("Helvetica", 30, "bold"),
                                width=2, height=1, fg="white", bg=self.COLOR_DEFAULT,
                                highlightbackground=self.COLOR_BORDER, highlightthickness=2,
                                relief="flat")
                cell.grid(row=row, column=col, padx=3, pady=3)
                row_cells.append(cell)
            self.cells.append(row_cells)

        # Message Label
        self.message_label = tk.Label(self.root, text="", font=("Helvetica", 16), 
                                      bg="#121213", fg="white")
        self.message_label.pack(pady=(10, 20))

        # On-Screen Keyboard
        self.key_buttons = {}
        keyboard_frame = tk.Frame(self.root, bg="#121213")
        keyboard_frame.pack(pady=10)

        keys = [
            "QWERTYUIOP",
            "ASDFGHJKL",
            "ZXCVBNM"
        ]

        for i, row_keys in enumerate(keys):
            row_frame = tk.Frame(keyboard_frame, bg="#121213")
            row_frame.pack()
            for char in row_keys:
                btn = tk.Button(row_frame, text=char, font=("Helvetica", 12, "bold"),
                                width=4, height=2, bg="#818384", fg="white",
                                relief="flat", activebackground="#565758", activeforeground="white",
                                command=lambda c=char: self.handle_keypress(tk.Event(), key=c))
                # Using a dummy event with a custom attribute or just direct call. 
                # Better to refactor handle_keypress to accept char directly or mock event.
                # Let's mock event roughly or allow handle_keypress to take key arg.
                btn.pack(side="left", padx=2, pady=2)
                self.key_buttons[char] = btn

    def handle_keypress(self, event, key=None):
        if self.game_over:
            if key == "Return" or (hasattr(event, 'keysym') and event.keysym == 'Return'):
                self.restart_game()
            return

        if key is None:
            key = event.keysym

        if len(key) == 1 and key.isalpha():
            self.add_letter(key.upper())
        elif key == "BackSpace":
            self.delete_letter()
        elif key == "Return":
            self.submit_guess()

    def add_letter(self, letter):
        if self.current_col < 5:
            self.guesses[self.current_row][self.current_col] = letter
            self.update_cell(self.current_row, self.current_col, letter)
            self.current_col += 1

    def delete_letter(self):
        if self.current_col > 0:
            self.current_col -= 1
            self.guesses[self.current_row][self.current_col] = ""
            self.update_cell(self.current_row, self.current_col, "")

    def update_cell(self, row, col, letter, color=None):
        cell = self.cells[row][col]
        cell.config(text=letter)
        if color:
             cell.config(bg=color, highlightbackground=color)
        elif letter:
             cell.config(highlightbackground=self.COLOR_FILLED_BORDER)
        else:
             cell.config(highlightbackground=self.COLOR_BORDER)

    def submit_guess(self):
        if self.current_col != 5:
            self.show_message("Not enough letters")
            return

        guess_word = "".join(self.guesses[self.current_row])
        if guess_word not in self.words:
            self.show_message("Not in word list")
            self.shake_row()
            return

        self.check_guess(guess_word)

    def check_guess(self, guess_word):
        # Color logic
        result = [self.COLOR_ABSENT] * 5
        secret_word_list = list(self.secret_word)
        guess_word_list = list(guess_word)

        # First pass: Correct position (Green)
        for i in range(5):
            if guess_word_list[i] == secret_word_list[i]:
                result[i] = self.COLOR_CORRECT
                secret_word_list[i] = None # Mark as used
                self.update_key_color(guess_word_list[i], self.COLOR_CORRECT)

        # Second pass: Wrong position (Yellow)
        for i in range(5):
            if result[i] == self.COLOR_ABSENT: # If not already marked green
                if guess_word_list[i] in secret_word_list:
                    result[i] = self.COLOR_PRESENT
                    secret_word_list[secret_word_list.index(guess_word_list[i])] = None # Mark as used
                    self.update_key_color(guess_word_list[i], self.COLOR_PRESENT)
                else:
                    self.update_key_color(guess_word_list[i], self.COLOR_ABSENT)

        # Apply colors with animation delay
        for i in range(5):
            self.update_cell(self.current_row, i, guess_word_list[i], result[i])
            self.root.update_idletasks()
            self.root.after(200)

        if guess_word == self.secret_word:
            self.show_message("Splendid!")
            self.game_over = True
            self.show_restart_message()
        elif self.current_row == 5:
            self.show_message(f"Game Over. Word was {self.secret_word}")
            self.game_over = True
            self.show_restart_message()
        else:
            self.current_row += 1
            self.current_col = 0

    def update_key_color(self, char, color):
        if char in self.key_buttons:
            btn = self.key_buttons[char]
            current_bg = btn.cget("bg")
            
            # Color priority: Green > Yellow > Gray > Default (#818384)
            # Codes: Green=#538d4e, Yellow=#b59f3b, Gray=#3a3a3c, Default=#818384
            
            if current_bg == self.COLOR_CORRECT:
                return # Already green, do nothing
            
            if current_bg == self.COLOR_PRESENT and color == self.COLOR_ABSENT:
                return # Already yellow, don't degrade to gray (e.g. if letter appears twice)
            
            # If current is Yellow, only upgrade to Green
            # If current is Default, take anything
            # If current is Gray, don't change (Wait, if I guess a letter and it's Gray, it stays Gray. It can't become Yellow or Green later because Gray means NOT in word... UNLESS I made a mistake in logic. But typically Gray is final.)
            
            # Actually, standard logic:
            # If new color is Green -> Set Green
            # If new color is Yellow -> Set Yellow ONLY IF not Green
            # If new color is Gray -> Set Gray ONLY IF not Green OR Yellow
            
            if color == self.COLOR_CORRECT:
                btn.config(bg=color)
            elif color == self.COLOR_PRESENT and current_bg != self.COLOR_CORRECT:
                btn.config(bg=color)
            elif color == self.COLOR_ABSENT and current_bg != self.COLOR_CORRECT and current_bg != self.COLOR_PRESENT:
                btn.config(bg=color)


    def show_message(self, message, duration=2000):
        self.message_label.config(text=message)
        if duration:
            self.root.after(duration, lambda: self.message_label.config(text=""))
    
    def show_restart_message(self):
         self.message_label.config(text=self.message_label.cget("text") + "\nPress ENTER to restart")

    def shake_row(self):
        # implementing a simple visual cue for invalid word could be added here
        pass

    def restart_game(self):
        self.secret_word = random.choice(self.words).upper()
        self.current_row = 0
        self.current_col = 0
        self.guesses = [["" for _ in range(5)] for _ in range(6)]
        self.game_over = False
        self.message_label.config(text="")
        
        for row in range(6):
            for col in range(5):
                self.update_cell(row, col, "")
                self.cells[row][col].config(bg=self.COLOR_DEFAULT, highlightbackground=self.COLOR_BORDER)
        
        # Reset Keyboard
        for btn in self.key_buttons.values():
            btn.config(bg="#818384")


if __name__ == "__main__":
    root = tk.Tk()
    game = PydleGame(root)
    root.mainloop()
