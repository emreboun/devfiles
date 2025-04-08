#!/bin/bash

# Set default commit message
default_msg="automated-commit"

# Get user input or use default
commit_msg="${1:-$default_msg}"

# Set counter file
counter_file=".commit_counter"

# Initialize counter if it doesn't exist
if [ ! -f "$counter_file" ]; then
  echo 1 >"$counter_file"
fi

# Read current counter and increment
counter=$(cat "$counter_file")
new_msg="$commit_msg-$counter"
echo $((counter + 1)) >"$counter_file"

# Perform git operations
git add --all
git commit -m "$new_msg"
git push
