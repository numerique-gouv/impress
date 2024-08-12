#!/bin/bash

mkdir -p "$(dirname -- "${BASH_SOURCE[0]}")/../.git/hooks/"
PRE_COMMIT_FILE="$(dirname -- "${BASH_SOURCE[0]}")/../.git/hooks/pre-commit"

cat <<'EOF' >$PRE_COMMIT_FILE
#!/bin/bash

# directories containing potential secrets
DIRS="."

bold=$(tput bold)
normal=$(tput sgr0)

# allow to read user input, assigns stdin to keyboard
exec </dev/tty

for d in $DIRS; do
	# find files containing secrets that should be encrypted
	for f in $(find "${d}" -type f -regex ".*\.enc\..*"); do
		if ! $(grep -q "unencrypted_suffix" $f); then
			printf '\xF0\x9F\x92\xA5 '
			echo "File $f has non encrypted secrets!"
			exit 1
		fi
	done
done
EOF

chmod +x $PRE_COMMIT_FILE
