import { useCallback, useState } from 'react'
import {
  Button,
  ButtonGroup,
  createStyles,
  makeStyles,
  Modal,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paper: {
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      maxWidth: 480,
      width: '90%',
    },
    buttonGroup: {
      marginTop: theme.spacing(3),
    },
  })
)

export function SubmitDecklistModal({
  initialLink,
  onCancel,
  onConfirm,
}: {
  initialLink?: string
  onCancel: () => void
  onConfirm: (decklist: { link: string; decklist?: string }) => void
}) {
  const classes = useStyles()
  const [link, setLink] = useState(initialLink ?? '')
  const trimmed = link.trim()
  const looksLikeUrl = /^https?:\/\//i.test(trimmed)
  const confirm = useCallback(() => {
    if (looksLikeUrl) onConfirm({ link: trimmed })
  }, [onConfirm, trimmed, looksLikeUrl])

  return (
    <Modal open onClose={onCancel} className={classes.modal}>
      <div className={classes.paper}>
        <h2>Decklist link</h2>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Paste the URL to your decklist (Fabrary, a Google Doc, etc). Your name on the cut chart
          links to it.
        </Typography>
        <TextField
          required
          fullWidth
          autoFocus
          label="Decklist URL"
          placeholder="https://fabrary.net/decks/..."
          margin="normal"
          value={link}
          onChange={(ev) => setLink(ev.target.value)}
          error={trimmed.length > 0 && !looksLikeUrl}
          helperText={
            trimmed.length > 0 && !looksLikeUrl ? 'Must start with http:// or https://' : ' '
          }
        />
        <ButtonGroup className={classes.buttonGroup}>
          <Button
            color="inherit"
            variant="contained"
            onClick={onCancel}
            style={{ marginRight: 20 }}
          >
            Cancel
          </Button>
          <Button color="secondary" variant="contained" onClick={confirm} disabled={!looksLikeUrl}>
            Save
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  )
}
