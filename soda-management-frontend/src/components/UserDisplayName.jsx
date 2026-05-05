import { Box } from "@mui/material";
import { capitalize, hasFirstNameCollision, splitUsername } from "../api/api";

export default function UserDisplayName({
  username,
  allUsernames,
  forceLastName = false,
  lastNameSx,
  sx,
  ...rest
}) {
  if (!username) return null;

  const { first, last } = splitUsername(username);
  const firstShown = capitalize(first || username);
  const showLast = Boolean(last) && (forceLastName || hasFirstNameCollision(username, allUsernames));

  return (
    <Box component="span" sx={sx} {...rest}>
      {firstShown}
      {showLast ? (
        <Box
          component="span"
          sx={{
            ml: 0.5,
            color: "text.secondary",
            fontWeight: "inherit",
            ...lastNameSx,
          }}
        >
          ({capitalize(last)})
        </Box>
      ) : null}
    </Box>
  );
}
