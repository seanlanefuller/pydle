import string

def import_words():
    source_file = "/usr/share/dict/american-english"
    output_file = "words.txt"
    
    count = 0
    with open(source_file, "r") as src, open(output_file, "w") as out:
        for line in src:
            word = line.strip()
            
            # Check if word is all lowercase (excludes proper names and acronyms)
            if word.islower() and word.isalpha():
                # Remove punctuation
                word_clean = word.translate(str.maketrans('', '', string.punctuation))
                
                if len(word_clean) == 5:
                    out.write(word_clean + "\n")
                    count += 1
                
    print(f"Imported {count} words to {output_file}")

if __name__ == "__main__":
    import_words()
