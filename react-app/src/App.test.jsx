import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { isVisibleForGroup, SESSIONS } from './data/sessions'

// loader instantané : mêmes données et même règle de groupe que le vrai, sans délai
const instantLoader = ({ group }) =>
  Promise.resolve(SESSIONS.filter((s) => isVisibleForGroup(s, group)))

function cardOf(title) {
  return screen.getByRole('button', { name: title }).closest('article')
}

describe('App - planning MATRiCE', () => {
  it('affiche les séances après le chargement (succès)', async () => {
    render(<App />)

    // Pendant le chargement
    expect(screen.getByText(/Chargement des séances/i)).toBeInTheDocument()

    // Les 6 séances du jeu de données doivent apparaître
    expect(await screen.findByText('React composants')).toBeInTheDocument()
    expect(screen.getByText('Travail autonome')).toBeInTheDocument()
    expect(screen.getByText('6 séances affichées')).toBeInTheDocument()
    expect(screen.queryByText(/Chargement des séances/i)).not.toBeInTheDocument()
  })

  it('le filtre groupe A inclut aussi les séances de la Promotion entière', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('React composants')

    await user.selectOptions(screen.getByLabelText(/^Groupe$/i), 'A')

    // s01 (groupe A) et s03/s06 (Promotion) doivent être visibles
    expect(await screen.findByText('React composants')).toBeInTheDocument() // s01, groupe A
    expect(screen.getByText('Données et SQL')).toBeInTheDocument() // s03, Promotion
    expect(screen.getByText('Travail autonome')).toBeInTheDocument() // s06, Promotion

    // s02 (groupe B uniquement) ne doit plus apparaître
    expect(screen.queryByText('React événements')).not.toBeInTheDocument()
  })

  it('combine les filtres groupe + domaine + recherche texte', async () => {
    const user = userEvent.setup()
    render(<App loader={instantLoader} />)
    await screen.findByText('React composants')

    // B -> B + Promotion : s02, s03, s05, s06
    await user.selectOptions(screen.getByLabelText(/^Groupe$/i), 'B')
    await screen.findByText('React événements')
    // + domaine projet -> s05, s06
    await user.selectOptions(screen.getByLabelText(/^Domaine$/i), 'projet')
    expect(screen.getByText('Revue de projet')).toBeInTheDocument()
    expect(screen.getByText('Travail autonome')).toBeInTheDocument()
    expect(screen.queryByText('React événements')).not.toBeInTheDocument()
    // + recherche "revue" -> s05 seule
    await user.type(screen.getByLabelText(/Rechercher une séance/i), 'revue')
    expect(screen.getByText('Revue de projet')).toBeInTheDocument()
    expect(screen.queryByText('Travail autonome')).not.toBeInTheDocument()
    expect(screen.getByText('1 séance affichée')).toBeInTheDocument()
  })

  it('affiche un message quand aucune séance ne correspond aux filtres (résultat vide), puis permet de réinitialiser', async () => {
    const user = userEvent.setup()
    render(<App loader={instantLoader} />)

    await screen.findByText('React composants')

    await user.type(screen.getByLabelText(/Rechercher une séance/i), 'texte-qui-ne-matche-rien-xyz')

    expect(await screen.findByText(/Aucune séance ne correspond à ces filtres/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }))
    expect(screen.getByLabelText(/Rechercher une séance/i)).toHaveValue('')
    expect(screen.getByText('React composants')).toBeInTheDocument()
  })

  it('affiche une erreur avec un bouton "Réessayer" qui relance le chargement', async () => {
    const user = userEvent.setup()
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('Serveur indisponible'))
      .mockImplementation(instantLoader)
    render(<App loader={loader} />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Serveur indisponible')

    await user.click(within(alert).getByRole('button', { name: 'Réessayer' }))

    expect(await screen.findByText('React composants')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('le filtre groupe a un nom accessible et peut être utilisé entièrement au clavier', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('React composants')

    // nom accessible via le label
    const groupSelect = screen.getByRole('combobox', { name: /^Groupe$/i })
    expect(groupSelect).toBeInTheDocument()

    // atteignable au clavier
    await user.tab()
    expect(groupSelect).toHaveFocus()

    await user.selectOptions(groupSelect, 'B')
    expect(groupSelect).toHaveValue('B')

    await screen.findByText('React événements')
    expect(screen.queryByText('Authentification')).not.toBeInTheDocument() // s04, groupe A seul
  })

  it("ouvre le détail au clavier, place le focus dans la modale et le rend à la carte à la fermeture", async () => {
    const user = userEvent.setup()
    render(<App loader={instantLoader} />)
    await screen.findByText('React composants')

    // filtres (3 champs) puis première carte
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    const cardButton = screen.getByRole('button', { name: 'React composants' })
    expect(cardButton).toHaveFocus()

    await user.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: 'React composants' })
    expect(within(dialog).getByRole('button', { name: /Fermer/ })).toHaveFocus()

    // Tab reste dans la modale (piège à focus)
    await user.tab()
    await user.tab()
    expect(dialog).toContainElement(document.activeElement)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cardButton).toHaveFocus()
  })

  it("ouvre le détail d'une séance et affiche les mêmes informations que la carte", async () => {
    const user = userEvent.setup()
    render(<App loader={instantLoader} />)

    await user.click(await screen.findByRole('button', { name: 'React composants' }))

    const dialog = await screen.findByRole('dialog', { name: 'React composants' })
    expect(within(dialog).getByText('Camille Exemple')).toBeInTheDocument()
    expect(within(dialog).getByText('Web')).toBeInTheDocument()
    expect(within(dialog).getByText('Confirmée')).toBeInTheDocument()
  })

  it('une modification de statut reste cohérente entre le détail et la liste, même après un rechargement', async () => {
    const user = userEvent.setup()
    render(<App loader={instantLoader} />)
    await screen.findByText('Authentification')
    expect(within(cardOf('Authentification')).getByText('Proposée')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Authentification' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer la séance' }))

    // détail et carte affichent la même valeur
    expect(within(dialog).getByText('Confirmée')).toBeInTheDocument()
    expect(within(cardOf('Authentification')).getByText('Confirmée')).toBeInTheDocument()

    // un changement de groupe recharge les données : la modification locale est conservée
    await user.keyboard('{Escape}')
    await user.selectOptions(screen.getByLabelText(/^Groupe$/i), 'A')
    await waitFor(() => expect(screen.queryByText('React événements')).not.toBeInTheDocument())
    expect(within(cardOf('Authentification')).getByText('Confirmée')).toBeInTheDocument()
  })

  it('une séance sans formateur (AUTO) ne peut pas être confirmée', async () => {
    const user = userEvent.setup()
    render(<App loader={instantLoader} />)

    await user.click(await screen.findByRole('button', { name: 'Travail autonome' }))
    const dialog = screen.getByRole('dialog')

    const confirm = within(dialog).getByRole('button', { name: 'Confirmer la séance' })
    expect(confirm).toBeDisabled()
    expect(confirm).toHaveAccessibleDescription('Un formateur est requis pour confirmer.')
  })
})
